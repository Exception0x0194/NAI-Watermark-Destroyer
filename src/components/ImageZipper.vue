<!-- src/components/ImageZipper.vue -->
<template>
  <div>
    <input type="file" @change="handleFiles" multiple accept="image/png" ref="fileInput" style="display: none;" />
    <div class="max-w-740px" style="margin: 0 auto">
      <el-upload class="image-uploader" drag multiple :before-upload="handleUpload">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">拖动文件到这里或者<em>点击选择文件</em></div>
      </el-upload>
    </div>
    <el-button @click="clearFiles" :icon="Delete">清空文件</el-button>
    <el-button @click="downloadZip" :icon="Download">打包下载</el-button>

    <p>待处理文件数量：{{ files.length }}</p>

    <div v-if="isLoading">
      <progress max="100" :value="progress">{{ progress }}%</progress>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ZipWriter, BlobReader } from '@zip.js/zip.js';
import { createWriteStream } from 'streamsaver';
import { ElMessage } from "element-plus";
import pLimit from "p-limit";
import { Delete, Download, UploadFilled } from "@element-plus/icons-vue";

import { embedStealthExif } from '../utils.js';

const availableImgExt = ["png", "webp", "bmp"];
const files = ref<File[]>([]);
const fileInput = ref<null | HTMLInputElement>(null);
const isLoading = ref(false);
const progress = ref(0);

const handleFiles = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    const newFiles = Array.from(input.files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return availableImgExt.includes(ext!);
    });
    files.value.push(...newFiles);  // Append new valid image files to the array
  }
};

async function handleUpload(file) {
  let fileExt = file.name.split(".").pop().toLowerCase();
  if (availableImgExt.indexOf(fileExt) != -1) {
    files.value.push(file);
  } else {
    ElMessage({
      message: file.name + " 不是一个支持的图片文件。",
      type: "error",
    });
  }
  return false;
};

const downloadZip = async () => {
  if (files.value.length == 0) {
    ElMessage({
      message: "没有需要处理的文件。",
      type: "warning"
    })
    return;
  }
  if (isLoading.value) {
    ElMessage({
      message: "正在处理图片，请勿重复操作。",
      type: "error"
    });
    return;
  }

  isLoading.value = true;
  progress.value = 0;
  const totalFiles = files.value.length;
  let processedFiles = 0;

  const limit = pLimit(10);

  // 创建 ZIP 文件的写入流
  const fileStream = createWriteStream("images_with_watermark.zip");
  const writer = fileStream.getWriter();
  const zipWriter = new ZipWriter(new WritableStream({
    write(chunk) {
      return writer.write(chunk);
    },
    close() {
      writer.close();
    }
  }));

  const promises = files.value.map(file => limit(async () => {
    try {
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });

      // 调用 WebAssembly 模块处理图像
      const watermarkedBytes = await embedStealthExif(new Uint8Array(arrayBuffer));
      const blob = new Blob([watermarkedBytes], { type: file.type });

      // 添加处理过的文件到zip
      await zipWriter.add("👻-" + file.name, new BlobReader(blob));

      // 更新进度
      processedFiles++;
      progress.value = (processedFiles / totalFiles) * 100;
    } catch (error) {
      console.error('Error processing file:', file.name, error);
    }
  }));

  await Promise.all(promises);

  await zipWriter.close();
  isLoading.value = false;
};

const clearFiles = () => {
  files.value = [];  // Clear the files array
};
</script>