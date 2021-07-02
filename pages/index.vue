<template>
  <v-row class="align-self-start">
    <v-card
      v-for="product in allProducts"
      :key="product.id"
      class="mx-4 my-4"
      max-width="200"
      :to="'/product/' + product.id"
    >
      <v-skeleton-loader
        v-if="!product.avatar"
        v-bind="attrs"
        type="image"
        height="200px"
      ></v-skeleton-loader>
      <v-img
        v-else
        :src="`http://localhost:3000/api/avatar?p=merchandise/${product.avatar}`"
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
  data() {
    return {
      pageTitle: '首頁',
    }
  },
  computed: {
    ...mapGetters('product', ['allProducts']),
  },
  created() {
    this.getAllProducts()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('product', ['getAllProducts']),
  },
}
</script>
