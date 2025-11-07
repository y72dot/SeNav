<template>
  <div :class="status.siteStatus !== 'normal' ? 'cover focus' : 'cover'">
    <img
      v-show="status.imgLoadStatus"
      class="background"
      alt="background"
      :src="bgUrl"
      :style="{ '--blur': set.backgroundBlur + 'px' }"
      @load="imgLoadComplete"
      @error.once="imgLoadError"
      @animationend="imgAnimationEnd"
    />
    <Transition name="fade">
      <div v-if="set.showBackgroundGray" class="gray" />
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { statusStore, setStore } from "@/stores";

const set = setStore();
const status = statusStore();
const bgUrl = ref(null);
const imgTimeout = ref(null);
const emit = defineEmits(["loadComplete"]);

// 从 manifest.json 读取本地 webp 壁纸列表，避免探测请求
// public/background/manifest.json 格式示例：
// { "images": ["bg1.webp", "bg2.webp", "bg3.webp"], "version": 1 }
const allowedExts = new Set(['.webp', '.jpg', '.jpeg', '.png']);

const loadBackgroundManifest = async () => {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}background/manifest.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error('manifest not found');
    const data = await res.json();
    let files = [];
    if (Array.isArray(data)) {
      files = data;
    } else if (Array.isArray(data.images)) {
      files = data.images;
    }
    // 只使用允许的图片类型（不再仅限 webp）
    const imageFiles = files.filter((name) => {
      if (typeof name !== 'string') return false;
      const lower = name.toLowerCase();
      const ext = lower.slice(lower.lastIndexOf('.'));
      return allowedExts.has(ext);
    });
    // 转换为完整 URL
    const urls = imageFiles.map((name) => `${import.meta.env.BASE_URL}background/${name}`);
    return urls;
  } catch (err) {
    console.warn('读取本地壁纸清单失败，将使用在线壁纸作为回退：', err);
    return [];
  }
};

// 赋值壁纸
const setBgUrl = async () => {
  const { backgroundType } = set;
  switch (backgroundType) {
    case 0:
      // 本地壁纸（使用 manifest.json 列表），避免探测请求
      {
        const urls = await loadBackgroundManifest();
        if (urls.length > 0) {
          const randomUrl = urls[Math.floor(Math.random() * urls.length)];
          bgUrl.value = randomUrl;
        } else {
          // 如果目录下没有 manifest 或列表为空，降级到必应壁纸
          const isMobile = window.innerWidth < 768;
          bgUrl.value = `https://api.dujin.org/bing/${isMobile ? "m" : "1920"}.php`;
        }
      }
      break;
    case 1: {
      const isMobile = window.innerWidth < 768;
      bgUrl.value = `https://api.dujin.org/bing/${isMobile ? "m" : "1920"}.php`;
      break;
    }
    case 2:
      // 随机风景 - 使用Picsum Photos (更快更稳定)
      bgUrl.value = "https://picsum.photos/1920/1080?random=" + Math.floor(Math.random() * 1000);
      break;
    case 3:
      // 随机动漫 - 使用樱花API (稳定的二次元图片服务)
      bgUrl.value = "https://www.dmoe.cc/random.php";
      break;
    case 4:
      // 随机风景2 - 使用CWLM API (备用风景服务)
      bgUrl.value = "https://api.cwlm.xyz/fj.php";
      break;
    case 5:
      // 随机二次元2 - 使用CWLM API (备用二次元服务)
      bgUrl.value = "https://api.cwlm.xyz/ecy.php";
      break;
    case 6:
      // 预留位置
      bgUrl.value = "https://api.cwlm.xyz/ecy.php";
      break;
    case 7:
      // 自定义壁纸
      bgUrl.value = set.backgroundCustom;
      break;
    default:{
      const isMobile = window.innerWidth < 768;
      bgUrl.value = `https://api.dujin.org/bing/${isMobile ? "m" : "1920"}.php`;
      break;
    }
  }
};

// 图片加载完成
const imgLoadComplete = () => {
  imgTimeout.value = setTimeout(
    () => {
      status.setImgLoadStatus(true);
    },
    Math.floor(Math.random() * (600 - 300 + 1)) + 300,
  );
};

// 图片动画完成
const imgAnimationEnd = () => {
  console.log("壁纸加载且动画完成");
  // 加载完成事件
  emit("loadComplete");
};

// 图片显示失败
const imgLoadError = () => {
  console.error("壁纸加载失败：", bgUrl.value);
  $message.error("失败，已临时切换回必应壁纸");
  const isMobile = window.innerWidth < 768;
  bgUrl.value = `https://api.dujin.org/bing/${isMobile ? "m" : "1920"}.php`;
};

onMounted(async () => {
  await setBgUrl();
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
});
</script>

<style lang="scss" scoped>
.cover {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: var(--body-background-color);
  &.focus {
    .background {
      filter: blur(calc(var(--blur) + 10px)) brightness(0.8);
      transform: scale(1.3);
    }
  }
  .background {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    backface-visibility: hidden;
    transform: scale(1.2);
    filter: blur(var(--blur));
    transition:
      filter 0.3s,
      transform 0.3s;
    animation: fade-blur-in 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .gray {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.5) 100%),
      radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.3) 166%);
  }
}
</style>
