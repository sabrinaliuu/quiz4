<template>
  <aside class="panel nav-panel">
    <p class="panel-title">Navigation</p>
    <div class="nav-grid">
      <button type="button" title="Zoom in" @click="$emit('command', 'zoom-in')">+</button>
      <button type="button" title="Zoom out" @click="$emit('command', 'zoom-out')">-</button>
      <button type="button" title="Home" @click="$emit('command', 'home')">Home</button>
    </div>
  </aside>
</template>

<script setup>
defineEmits(['command'])
</script>

<style scoped>
.nav-panel {
  width: min(280px, 100%);
  padding: 14px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

button {
  min-height: 34px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 6px;
  color: #f8fafb;
  background: rgb(255 255 255 / 7%);
  cursor: pointer;
}
</style>
