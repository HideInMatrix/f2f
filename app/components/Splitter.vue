<template>
  <div ref="container" class="w-full flex h-full" :style="containerStyle">
    <div class="overflow-auto" :style="leftStyle">
      <slot name="left" />
    </div>

    <div class="w-2 cursor-col-resize bg-gray-300 mx-2 rounded-2" @mousedown.prevent="startDrag" />

    <div class="overflow-auto flex-auto">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

const initial = ref<number>(280); // default left pane width in px
const container = ref<HTMLElement | null>(null);
const dragging = ref(false);

const leftStyle = computed(() => ({ width: `${initial.value}px`, minWidth: "120px", maxWidth: "80%" }));
const containerStyle = computed(() => ({ display: "flex", height: "100%" }));

function startDrag(e: MouseEvent) {
  dragging.value = true;
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
}

function onDrag(e: MouseEvent) {
  if (!dragging.value || !container.value) return;
  const rect = container.value.getBoundingClientRect();
  let newWidth = e.clientX - rect.left;
  const min = 120;
  const max = rect.width * 0.8;
  if (newWidth < min) newWidth = min;
  if (newWidth > max) newWidth = max;
  initial.value = Math.round(newWidth);
}

function stopDrag() {
  dragging.value = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
}

onMounted(() => {
  // nothing for now
});

onBeforeUnmount(() => {
  stopDrag();
});
</script>

