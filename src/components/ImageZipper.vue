<!-- src/components/ImageZipper.vue -->
<template>
  <div>
    <input type="file" @change="handleFiles" multiple accept="image/png" ref="fileInput" style="display: none;" />
    <button @click="triggerFileInput">添加文件</button>
    <button @click="clearFiles">清空文件</button>
    <button @click="downloadZip">打包下载</button>

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

const availableImgExt = ["png"];
const files = ref<File[]>([]);
const fileInput = ref<null | HTMLInputElement>(null);
const isLoading = ref(false);
const progress = ref(0);

const watermarkContent = JSON.stringify({ "Description": "👻👻👻", "Software": "NovelAI", "Source": "Stable Diffusion XL 9CC2F394", "Generation time": "11.4514", "Comment": "{\"prompt\": \"👻👻👻\", \"steps\": 28, \"height\": 1024, \"width\": 1024, \"scale\": 5, \"uncond_scale\": 1.0, \"cfg_rescale\": 0.0, \"seed\": \"\", \"n_samples\": 1, \"hide_debug_overlay\": false, \"noise_schedule\": \"native\", \"legacy_v3_extend\": false, \"reference_information_extracted_multiple\": [], \"reference_strength_multiple\": [], \"sampler\": \"k_euler_ancestral\", \"controlnet_strength\": 1.0, \"controlnet_model\": null, \"dynamic_thresholding\": false, \"dynamic_thresholding_percentile\": 0.999, \"dynamic_thresholding_mimic_scale\": 10.0, \"sm\": false, \"sm_dyn\": false, \"skip_cfg_below_sigma\": 0.0, \"lora_unet_weights\": null, \"lora_clip_weights\": null, \"uc\": \"\", \"request_type\": \"PromptGenerateRequest\", \"signed_hash\": \"\"}" });

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

const downloadZip = async () => {
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
    const watermarkedImage = await embedStealthExif(imgSrc, watermarkContent);
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