<template>
  <v-row class="justify-center">
    <v-col class="align-center" cols="12" md="6" lg="4">
      <v-card elevation="2" class="mx-5 pa-5" outlined tile>
        <v-card-title class="justify-center">登入</v-card-title>
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="user.account"
              label="帳號"
              hide-details="true"
              outlined
              clearable
            >
            </v-text-field>
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="user.password"
              :append-icon="showPw ? 'mdi-eye' : 'mdi-eye-off'"
              :type="showPw ? 'text' : 'password'"
              label="密碼"
              hide-details="true"
              outlined
              clearable
              @click:append="showPw = !showPw"
            >
            </v-text-field>
          </v-col>
        </v-row>
        <v-row class="mb-5 mx-md-3">
          <v-col class="d-flex justify-center" cols="12">
            <v-btn color="primary" class="mr-4" @click="login(user)"
              >登入</v-btn
            >
            <v-btn color="accent" @click="reset">清除</v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { mapActions } from 'vuex'
export default {
  data() {
    return {
      pageTitle: '登入',
      user: {
        account: '',
        password: '',
      },
      showPw: false,
    }
  },
  created() {
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions(['login']),
    reset() {
      this.user.username = this.user.password = ''
    },
  },
}
</script>
