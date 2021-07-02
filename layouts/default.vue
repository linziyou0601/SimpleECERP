<template>
  <v-app>
    <NavigationDrawer />
    <v-app-bar app>
      <v-app-bar-nav-icon @click.stop="$nuxt.$emit('switchDrawer')" />
      <v-toolbar-title v-text="title + ' ' + pageTitle" />
      <v-spacer />
      <v-btn icon @click="$vuetify.theme.dark = !$vuetify.theme.dark">
        <v-icon>{{ darkMode ? 'mdi-lightbulb-off' : 'mdi-lightbulb' }}</v-icon>
      </v-btn>
      <v-btn v-if="token" icon :to="'/myOrder'">
        <v-icon>mdi-file-document-edit</v-icon>
      </v-btn>
      <v-btn v-if="token" icon :to="'/cart'">
        <v-badge
          :content="totalCartAmount"
          :value="allCarts.length"
          color="red"
          overlap
        >
          <v-icon>mdi-cart</v-icon>
        </v-badge>
      </v-btn>
      <UserMenu v-if="token" />
      <v-btn v-else-if="!token" icon :to="'/login'">
        <v-icon>mdi-login</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main color="warning">
      <v-container class="fill-height" fluid>
        <AlertDialog />
        <nuxt />
      </v-container>
    </v-main>
    <v-footer :absolute="false" app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  data() {
    return {
      title: 'Vuetify.js',
      pageTitle: '',
    }
  },
  head() {
    return {
      title: this.pageTitle,
    }
  },
  computed: {
    ...mapGetters(['token', 'user']),
    ...mapGetters('cart', ['allCarts']),
    darkMode() {
      return this.$vuetify.theme.dark
    },
    totalCartAmount() {
      return Object.values(this.allCarts).reduce(
        (t, { amount }) => t + amount,
        0
      )
    },
  },
  created() {
    if (this.token) this.getAllCarts()
    this.$nuxt.$on('pageTitle', (data) => (this.pageTitle = data))
  },
  methods: {
    ...mapActions('cart', ['getAllCarts']),
  },
}
</script>

<style>
.max-w-100 {
  max-width: 100px;
}
.max-w-200 {
  max-width: 200px;
}
.max-w-300 {
  max-width: 300px;
}
</style>
