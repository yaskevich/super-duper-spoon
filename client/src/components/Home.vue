<template>
  <div class="home">
    <div v-if="isLoaded" style="text-align: center; max-width: 350px; margin: auto">
      <n-card :bordered="false">
        <n-auto-complete v-model:value="query" :input-props="{
      autocomplete: 'disabled'
    }" :options="options" placeholder="..." clearable @update:value="getOptions" :render-label="renderItem"
          @select="selectItem" />
        <!-- :on-update:value="getOptions"   -->
      </n-card>
      <div v-html="selection" style="text-align: left"></div>
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

const selection = ref('');

const renderItem = (x: any) => `${x.label}  [${x.lid}]`;

const selectItem = async (id: number) => {
  // console.log(id);
  const res = await store.get('item', id);
  // console.log(res);
  const body = res.body.replace(/\n/mg, "<br/>").replace(/\<c\s+c\=\"/mg, '<span style="color:').replace(/\<\/c\>/mg, '</span>');
  selection.value = body;
};

const getOptions = async () => {
  if (query.value) {
    const res = await store.get('suggestions', query.value);
    options.value = res.map((item: any) => ({
      label: `${item.title}`,
      value: item.id,
      lid: item.lid
    }));
    if (res?.[0]) {
      await selectItem(res.shift().id);
    } else {
      console.log('0 for', query.value);
    }
  }
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


<style>
.root {
  color: silver;
  font-weight: bold;
}

.spec {
  font-style: italic;
  /* font-style: oblique; */
}
</style>