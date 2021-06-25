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
import { mapGetters } from 'vuex'
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
    darkMode() {
      return this.$vuetify.theme.dark
    },
  },
  created() {
    this.$nuxt.$on('pageTitle', (data) => (this.pageTitle = data))
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
