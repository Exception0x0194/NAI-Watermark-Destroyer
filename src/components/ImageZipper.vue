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
    <el-button @click="clearFiles">清空文件</el-button>
    <el-button @click="downloadZip">打包下载</el-button>

    <p>待处理文件数量：{{ files.length }}</p>

    <div v-if="isLoading">
      <progress max="100" :value="progress">{{ progress }}%</progress>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import JSZip from 'jszip';
import { embedStealthExif } from '../utils.js';
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";

const availableImgExt = ["png"];
const files = ref<File[]>([]);
const fileInput = ref<null | HTMLInputElement>(null);
const isLoading = ref(false);
const progress = ref(0);

const triggerFileInput = () => {
  fileInput.value?.click();
};

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
  console.log(file);

  let fileExt = file.name.split(".").pop().toLowerCase();
  if (availableImgExt.indexOf(fileExt) != -1) {
    files.value.push(file);
  } else {
    ElMessage({
      message: file.name + " 不是一个支持的 PNG 文件。",
      type: "error",
    });
  }
  return false;
};

const downloadZip = async () => {
  if (files.value.length == 0 || isLoading) return;

  isLoading.value = true;
  progress.value = 0;
  const zip = new JSZip();

  const totalFiles = files.value.length;
  let processedFiles = 0;

  for (let file of files.value) {
    // 更新进度
    progress.value = (processedFiles / totalFiles) * 100;

    let reader = new FileReader();
    const readAsDataURL = (file) => new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const imgSrc = await readAsDataURL(file);
    const watermarkedImage = await embedStealthExif(imgSrc);
    const base64Response = await fetch(watermarkedImage);
    const blob = await base64Response.blob();
    zip.file("👻-" + file.name, blob, { binary: true });

    processedFiles++;
    progress.value = (processedFiles / totalFiles) * 100;
  }

  zip.generateAsync({ type: 'blob' }).then((content) => {
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images_with_watermarks.zip';
    a.click();
    URL.revokeObjectURL(url);  // Cleanup after download
    isLoading.value = false;
  });
};

const clearFiles = () => {
  files.value = [];  // Clear the files array
};
</script>