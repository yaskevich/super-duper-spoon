<template>
    <div style="text-align: center; max-width: 350px; margin: auto">
        <n-card :bordered="false">
            {{ store?.state?.user?.queries }}
        </n-card>
    </div>
</template>


<script setup lang="ts">
import { ref, reactive, onBeforeMount, computed } from 'vue';
import store from '../store';
</script>