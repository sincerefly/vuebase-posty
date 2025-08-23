<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './lib/supabaseClient'

const posts = ref([])

async function getPosts() {
  const { data } = await supabase.from('posts').select()
  posts.value = data
}

onMounted(async () => {
  await getPosts()
})
</script>

<template>
  <ul>
    <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
  </ul>
</template>