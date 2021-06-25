<template>
  <v-row class="align-self-start">
    <v-card
      v-for="product in allMerchandises"
      :key="product.id"
      class="mx-4 my-4"
      max-width="200"
      :to="'/inspire'"
    >
      <v-img
        src="https://cdn.vuetifyjs.com/images/cards/sunshine.jpg"
        height="200px"
      ></v-img>

      <v-card-title> {{ product.title }} </v-card-title>

      <v-card-text>
        <v-chip color="accent" outlined>
          {{ product.price }}
        </v-chip>
      </v-card-text>
    </v-card>
  </v-row>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  auth: false,
  data() {
    return {
      pageTitle: '首頁',
    }
  },
  computed: {
    ...mapGetters('merchandise', ['allMerchandises']),
  },
  created() {
    this.getAllMerchandises()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('merchandise', ['getAllMerchandises']),
  },
}
</script>
