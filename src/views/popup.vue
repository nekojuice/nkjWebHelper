<template>
  <div class="sidenav p-0 flex justify-content-center flex-wrap">
    <div class="w-2rem flex justify-content-center align-content-start flex-wrap">
      <Button v-tooltip="'說明'" class="h-2rem w-2rem flex align-items-center justify-content-center" icon="pi pi-ellipsis-v" severity="secondary" />
      <div class="h-1rem w-2rem"></div>
      <Button
        v-tooltip="'DOM定位器(ctrl + Q)'"
        class="h-2rem w-2rem flex align-items-center justify-content-center"
        label="D"
        :severity="isValidPage(currentUrl) ? 'info' : 'secondary'"
        :disabled="!isValidPage(currentUrl)"
        :outlined="!domLocatorEnable"
        @click="toggleDomLocatorEnable()" />
    </div>
  </div>
  <div class="main">
    <Card>
      <template #content>
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center">
            <ToggleSwitch v-model="_enable.domLocatorHotkey" @change="saveCache" />
            <label class="ml-2">enable_locator</label>
          </div>
          <div class="flex items-center">
            <ToggleSwitch v-model="_enable.nkjythelper" @change="saveCache" />
            <label class="ml-2">nkjythelper</label>
          </div>
          <div class="flex items-center">
            <ToggleSwitch v-model="_enable.drawUrl" @change="saveCache" />
            <label class="ml-2">drawUrl</label>
          </div>
        </div>
      </template>
    </Card>

    <!-- <Card>
      <template #content>
        <DataTable :value="products" editMode="cell" @cell-edit-complete="onCellEditComplete">
          <Column field="label" header="label" style="width: 20%">
            <template #editor="{ data, field }">
              <InputText v-model="data[field]" fluid />
            </template>
          </Column>
          <Column field="inventoryStatus" header="Status" style="width: 20%">
            <template #editor="{ data, field }">
              <Select v-model="data[field]" :options="statuses" optionLabel="label" optionValue="value" placeholder="Select a Status" fluid>
                <template #option="slotProps">
                  <Tag :value="slotProps.option.value" />
                </template>
              </Select>
            </template>
            <template #body="slotProps">
              <Tag :value="slotProps.data.inventoryStatus" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card> -->

    <domlocator v-model="domLocatorMode" v-if="domLocatorEnable" @modeChange="updateDomLocatorStatus()" />
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from "vue";
import Button from "primevue/button";
import ToggleSwitch from "primevue/toggleswitch";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Select from "primevue/select";

import { isValidPage, sendTabMessage, setStorage, getStorage, deleteStorage } from "@/service/commonService";
import domlocator from "@/components/domlocator.vue";

onMounted(() => {
  loadCache();
  initDomLocatorStatus();
  getCurrentUrl();
});

const _enable = ref({ domLocatorHotkey: false, nkjythelper: false, drawUrl: false });
const _radialMenu = ref([]);

const domLocatorEnable = ref(false);
const domLocatorMode = ref("xPath");
const currentUrl = ref();

const getCurrentUrl = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentUrl.value = tabs[0].url;
  });
};

const loadCache = async () => {
  _enable.value = (await getStorage("cache")) || _enable.value;
};
const saveCache = () => {
  setStorage({ cache: _enable.value });
};
const deleteAllData = () => {
  deleteStorage(["cache"]);
};

const toggleDomLocatorEnable = () => {
  domLocatorEnable.value = !domLocatorEnable.value;
  updateDomLocatorStatus();
};
const updateDomLocatorStatus = async () => {
  sendTabMessage("updateDomLocatorStatus", { domLocatorEnable: domLocatorEnable.value, domLocatorMode: domLocatorMode.value });
};
const initDomLocatorStatus = async () => {
  const response = await sendTabMessage("getDomLocatorStatus");
  if (response) {
    domLocatorEnable.value = response.message.domLocatorEnable;
    domLocatorMode.value = response.message.domLocatorMode;
  }
};
</script>
<style scoped>
.sidenav {
  height: 90%;
  width: 32px;
  position: fixed;
  z-index: 1;
  overflow: hidden;
}
.main {
  margin-left: 64px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
