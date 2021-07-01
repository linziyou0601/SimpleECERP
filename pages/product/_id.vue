<template>
  <v-row class="mx-sm-3 my-sm-3 align-self-start">
    <v-col cols="12" sm="4" md="6" lg="5" elevation="3">
      <v-img
        class="rounded-lg"
        src="https://cdn.vuetifyjs.com/images/cards/sunshine.jpg"
        aspect-ratio="1"
      ></v-img>
    </v-col>

    <v-col>
      <v-sheet min-height="70vh" rounded="lg" class="px-5 py-5" elevation="3">
        <v-card-title class="text-h4">{{ product.title }}</v-card-title>
        <v-card-text>
          <div class="mb-4">
            Small plates, salads & sandwiches - an intimate setting with 12
            indoor seats plus patio seating.
          </div>

          <div class="mb-4 text-subtitle-1" border>
            <v-chip class="text-h6" color="primary" outlined>
              {{ product.price | currency }}
            </v-chip>
          </div>
        </v-card-text>

        <v-divider class="mx-4"></v-divider>

        <v-card-actions>
          <v-btn
            color="primary"
            elevation="2"
            fab
            x-small
            outlined
            @click="quantity -= 1"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
          <v-text-field
            v-model.number="quantity"
            type="number"
            class="mx-2 max-w-200 centered-input"
            hide-details="true"
            dense
            outlined
            rounded
            single-line
            required
          ></v-text-field>
          <v-btn
            color="primary"
            elevation="2"
            fab
            x-small
            outlined
            @click="quantity += 1"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <v-spacer />
          <v-btn class="ml-5 px-2 px-sm-10" color="primary" rounded>
            加入購物車
          </v-btn>
        </v-card-actions>
        <v-alert
          v-if="numberAlert"
          class="mt-5"
          border="bottom"
          text
          type="error"
        >
          {{ numberAlert }}
        </v-alert>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  auth: false,
  filters: {
    currency(price) {
      return String(price).toLocaleString('zh-TW') + '元'
    },
  },
  data() {
    return {
      pageTitle: '首頁',
      quantity: 0,
    }
  },
  computed: {
    ...mapGetters('product', ['product']),
    numberAlert() {
      return this.quantity >= 0 ? '' : '必須大於0'
    },
  },
  created() {
    const params = this.$route.params
    this.getProduct(params.id)
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('product', ['getProduct']),
  },
}
</script>

<style lang="scss">
.centered-input input {
  text-align: center;
  -moz-appearance: textfield;
}
.centered-input input::-webkit-outer-spin-button,
.centered-input input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
.centered-input .v-input__slot {
  padding: 0 !important;
}
</style>
