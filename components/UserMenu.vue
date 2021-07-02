<template>
  <div class="text-center">
    <v-menu bottom offset-y>
      <template #activator="{ on, attrs }">
        <v-avatar color="accent" size="36" v-bind="attrs" v-on="on">
          <span v-if="!user.avatar" class="text-h7">{{
            user.name ? user.name[0] : ''
          }}</span>
          <v-img
            v-if="user.avatar"
            class="rounded-lg"
            :src="`http://localhost:3000/api/avatar?p=${user.avatar}`"
            aspect-ratio="1"
          ></v-img>
        </v-avatar>
      </template>
      <v-list>
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          :to="item.to"
          @click="navItemTrigger(item.trigger)"
          class="text-center"
        >
          <v-list-item-title>
            {{ item.title || user.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  data: () => ({
    items: [
      { title: null, to: '/profile', trigger: '' },
      { title: '登出', to: null, trigger: 'logout' },
    ],
    offset: true,
  }),
  computed: {
    ...mapGetters(['user']),
  },
  methods: {
    navItemTrigger(e) {
      if (this[e]) this[e]({})
    },
    ...mapActions(['logout']),
  },
}
</script>
