<template>
  <div ref="container" class="splitter" :style="containerStyle">
    <div class="pane left" :style="leftStyle">
      <slot name="left" />
    </div>

    <div class="resizer" @mousedown.prevent="startDrag" />

    <div class="pane right">
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

<style scoped>
.splitter {
  width: 100%;
  display: flex;
  height: 100%;
}
.pane {
  overflow: auto;
}
.resizer {
  width: 6px;
  cursor: col-resize;
  background: rgba(0, 0, 0, 0.06);
  margin: 0 4px;
  border-radius: 3px;
}
.left {
}
.right {
  flex: 1 1 auto;
}
</style>
