<template>
  <div class="home">
    <div v-if="isLoaded" style="text-align: center; max-width: 350px; margin: auto">
      <n-card :bordered="false">
        <n-auto-complete v-model:value="query" :input-props="{
      autocomplete: 'disabled'
    }" :options="options" placeholder="..."  clearable  @update:value="getOptions" />
    <!-- :on-update:value="getOptions"   -->
    </n-card>
    </div>
    <div v-else style="text-align: center">...loading</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, computed } from 'vue';
import axios from 'axios';
import store from '../store';

store.state.token = 'test';

const query = ref('');
const options = ref([]);

const getOptions = async () => {
  const res = await store.get('suggestions', query.value);
  // console.log(res);
  options.value = res.map((item: any) => ({
    label: `${item.title} (${item.lid})`,
    value: item.id
  }));
};


const isLoaded = ref(false);
// const datum = reactive([]);

onBeforeMount(async () => {
  // const data = await store.get('all');
  // const data = await store.get('search', 'пар');

  // Object.assign(datum, data);
  isLoaded.value = true;
});
</script>
