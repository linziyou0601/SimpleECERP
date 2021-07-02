<template>
  <v-navigation-drawer v-model="drawer" expand-on-hover app>
    <v-list shaped>
      <div v-for="(item, i) in items" :key="i">
        <!-- 沒有子項目 -->
        <v-list-item
          v-if="!item.subitems && scopeFlag(item.scope)"
          :to="item.to"
          :color="$vuetify.theme.dark ? 'info' : 'primary'"
          router
          exact
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>

        <!-- 有子項目 -->
        <v-list-group
          v-else-if="scopeFlag(item.scope)"
          no-action
          :value="$route.path.startsWith(item.prefix)"
          :color="$vuetify.theme.dark ? 'info' : 'primary'"
        >
          <template #activator>
            <v-list-item-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-action>
            <v-list-item-content
              ><v-list-item-title v-text="item.title"
            /></v-list-item-content>
          </template>
          <v-list-item
            v-for="(subitem, j) in item.subitems"
            v-show="scopeFlag(subitem.scope)"
            :key="j"
            :to="subitem.to"
            :color="$vuetify.theme.dark ? 'info' : 'primary'"
            router
            exact
          >
            <v-list-item-title v-text="subitem.title" />
            <v-icon>{{ subitem.icon }}</v-icon>
          </v-list-item>
        </v-list-group>
      </div>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  data() {
    return {
      drawer: false,
      items: [
        {
          icon: 'mdi-apps',
          title: '首頁',
          to: '/',
          scope: [],
        },
        {
          icon: 'mdi-package-variant-closed',
          title: '進銷存',
          prefix: '/merchandise',
          scope: ['admin'],
          subitems: [
            {
              icon: 'mdi-shopping',
              title: '商品管理',
              to: '/merchandise/manage',
              scope: ['admin'],
            },
            {
              icon: 'mdi-golf-cart',
              title: '進貨單',
              to: '/merchandise/purchase',
              scope: ['admin'],
            },
            {
              icon: 'mdi-point-of-sale',
              title: '銷貨單',
              to: '/merchandise/sale',
              scope: ['admin'],
            },
            {
              icon: 'mdi-drag-variant',
              title: '調整單',
              to: '/merchandise/adjustment',
              scope: ['admin'],
            },
          ],
        },
        {
          icon: 'mdi-file-document-edit',
          title: '訂單管理',
          to: '/order',
          scope: ['admin'],
        },
        {
          icon: 'mdi-account-multiple',
          title: '會員管理',
          to: '/user',
          scope: ['admin'],
        },
      ],
    }
  },
  computed: {
    ...mapGetters(['token', 'user']),
  },
  created() {
    this.$nuxt.$on('switchDrawer', () => (this.drawer = !this.drawer))
  },
  methods: {
    scopeFlag(scope) {
      return !scope.length || (this.user && scope.includes(this.user.scope))
    },
  },
}
</script>
