<script setup>
import ImageZipper from './components/ImageZipper.vue'
</script>

<template>
  <h1 class="font-bold text-3xl">NAI 隐匿水印修改器</h1>
  <p class="text-gray-500 my-2 text-sm">
    替换/清除 NAI 生成图像中的隐匿水印内容
  </p>
  <ImageZipper />
  <p class="text-gray-500 my-2 text-sm">
    *计算完全在本地进行
  </p>
  <div class="my-4 pt-4">
    <a class="inline-block text-sm text-gray-500"
      href="https://github.com/Exception0x0194/NAI-Watermark-Destroyer">GitHub</a>
    <br />
  </div>
</template>
