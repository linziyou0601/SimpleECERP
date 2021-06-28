<template>
  <v-navigation-drawer v-model="drawer" expand-on-hover app>
    <v-list shaped>
      <div v-for="(item, i) in items" :key="i">
        <!-- 沒有子項目 -->
        <v-list-item
          v-if="!item.subitems"
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
          v-else
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
export default {
  data() {
    return {
      drawer: false,
      items: [
        {
          icon: 'mdi-apps',
          title: '首頁',
          to: '/',
        },
        {
          icon: 'mdi-package-variant-closed',
          title: '進銷存',
          prefix: '/merchandise',
          subitems: [
            {
              icon: 'mdi-shopping',
              title: '商品管理',
              to: '/merchandise/manage',
            },
            {
              icon: 'mdi-golf-cart',
              title: '進貨單',
              to: '/merchandise/purchase',
            },
            {
              icon: 'mdi-point-of-sale',
              title: '銷貨單',
              to: '/merchandise/sale',
            },
            {
              icon: 'mdi-drag-variant',
              title: '調整單',
              to: '/merchandise/adjustment',
            },
          ],
        },
        {
          icon: 'mdi-account-multiple',
          title: '會員',
          prefix: '/user',
          subitems: [
            {
              icon: 'mdi-account-cog',
              title: '會員管理',
              to: '/user/manage',
            },
          ],
        },
        {
          icon: 'mdi-chart-bubble',
          title: 'Inspire',
          to: '/inspire',
        },
      ],
    }
  },
  created() {
    this.$nuxt.$on('switchDrawer', () => (this.drawer = !this.drawer))
  },
}
</script>
