<template>
  <div class="text-center">
    <v-menu bottom offset-y>
      <template #activator="{ on, attrs }">
        <v-btn icon v-bind="attrs" v-on="on">
          <v-icon>mdi-account</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          :to="item.to"
          @click="navItemTrigger(item.trigger)"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
export default {
  data: () => ({
    items: [
      { title: 'AAAA', to: null, trigger: '' },
      { title: 'BBBB', to: null, trigger: '' },
      { title: 'CCCC', to: null, trigger: '' },
      { title: '登出', to: null, trigger: 'logout' },
    ],
    offset: true,
  }),
  methods: {
    navItemTrigger(e) {
      if (this[e]) this[e]()
    },
    ...mapActions(['logout']),
  },
}
</script>
