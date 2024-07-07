<template>
    <div style="text-align: center; max-width: 350px; margin: auto">
        <n-card :bordered="false">
            <n-space vertical v-if="store?.state?.user?.queries?.length">
                <div v-for="item in store?.state?.user?.queries">
                    <n-button @click="$router.push('/' + item)">
                        {{ item }}
                    </n-button>
                </div>
            </n-space>
            <div v-else>
                No items
                {{ store?.state?.user?.queries }}
            </div>
        </n-card>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, computed } from 'vue';
import store from '../store';
</script>