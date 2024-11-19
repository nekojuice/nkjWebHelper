<template>
  <div>
    <Card>
      <template #content>
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center">
            <RadioButton v-model="domlocatormode" inputId="domlocator_css" name="domlocatormode" :value="'css'" @change="emit('modeChange')" />
            <label for="domlocator_css" class="ml-2">css</label>
          </div>
          <div class="flex items-center">
            <RadioButton v-model="domlocatormode" inputId="domlocator_xpath" name="domlocatormode" :value="'xPath'" @change="emit('modeChange')" />
            <label for="domlocator_xpath" class="ml-2">xPath</label>
          </div>
          <div class="flex items-center">
            <RadioButton v-model="domlocatormode" inputId="domlocator_relativexpath" name="domlocatormode" :value="'relativexPath'" @change="emit('modeChange')" />
            <label for="domlocator_relativexpath" class="ml-2">relative xPath</label>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import RadioButton from "primevue/radiobutton";
import Card from "primevue/card";

const emit = defineEmits(["modeChange"]);
const domlocatormode = defineModel();
</script>

<style scoped></style>
