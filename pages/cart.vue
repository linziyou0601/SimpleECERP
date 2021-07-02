<template>
  <v-row class="d-flex justify-center">
    <v-col cols="12" sm="8" md="6" lg="4">
      <v-card>
        <v-card-title class="justify-center pt-6">購物清單</v-card-title>

        <v-card-text>
          <v-container>
            <v-list-item-group v-model="selections" multiple active-class="">
              <v-list-item
                v-for="(item, key) in allCarts"
                :key="key"
                :value="item"
              >
                <template #default="{ active }">
                  <v-list-item-action>
                    <v-checkbox :input-value="active"></v-checkbox>
                  </v-list-item-action>

                  <v-list-item-content>
                    <v-list-item-title>
                      {{ item.merchandise.title }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ item.merchandise.price | currency }} ×
                      {{ item.amount }} {{ item.merchandise.unit }}
                    </v-list-item-subtitle>
                  </v-list-item-content>

                  <v-list-item-action>
                    <v-btn icon @click="remove(item.merchandiseId)">
                      <v-icon>mdi-close-thick</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </template>
              </v-list-item>
            </v-list-item-group>

            <v-divider class="my-3" />

            <!-- 訂單金額及操作區 -->
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="text-right">總金額</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action class="text-h5">
                {{ totalPrice | currency }}
              </v-list-item-action>
            </v-list-item>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            class="mb-3 px-5"
            outlined
            rounded
            @click="reset"
          >
            清空
          </v-btn>
          <v-btn
            color="primary"
            class="mr-5 mb-3 px-5"
            depressed
            rounded
            @click="orderDialog = true"
          >
            訂購
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>

    <!-- 確認表單對話框 -->
    <v-dialog v-model="orderDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">操作確認</v-card-title>
        <v-card-text>確定要進行訂購？</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="accent" text @click="orderDialog = false">取消</v-btn>
          <v-btn color="primary" text @click="checkout">確定</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  filters: {
    currency(price) {
      return String(price).toLocaleString('zh-TW') + '元'
    },
  },
  data() {
    return {
      pageTitle: '購物車',
      orderDialog: false,
      selections: [],
    }
  },
  computed: {
    ...mapGetters(['token', 'user']),
    ...mapGetters('cart', ['allCarts']),
    totalPrice() {
      console.log(this.selections)
      return Object.values(this.selections).reduce(
        (t, { amount, merchandise }) => t + amount * merchandise.price,
        0
      )
    },
  },
  created() {
    this.getAllCarts()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('cart', [
      'getAllCarts',
      'checkoutCart',
      'removeCart',
      'resetCart',
    ]),
    remove(id) {
      this.removeCart({ userId: this.user.id, merchandiseId: id })
      this.getAllCarts()
    },
    reset() {
      this.resetCart({ userId: this.user.id })
      this.getAllCarts()
    },
    checkout() {
      this.checkoutCart({ userId: this.user.id, carts: this.selections })
      this.orderDialog = false
      this.getAllCarts()
    },
  },
}
</script>
