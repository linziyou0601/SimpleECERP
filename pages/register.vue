<template>
  <v-row class="justify-center">
    <v-col class="align-center" cols="12" md="6" lg="4">
      <v-card elevation="2" class="mx-5 pa-5" outlined tile>
        <v-card-title class="justify-center">註冊</v-card-title>
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model.trim="user.account"
              label="帳號*"
              type="text"
              :rules="[rules.validNullString]"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.trim="user.password"
              label="新密碼*"
              :rules="[rules.validNullString]"
              type="password"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.trim="user.passwordConfirm"
              label="確認密碼*"
              :rules="[rules.validNullString]"
              type="password"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.trim="user.name"
              label="姓名*"
              type="text"
              :rules="[rules.validNullString]"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.trim="user.email"
              label="信箱*"
              :rules="[rules.validNullString]"
              type="text"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.trim="user.phone"
              label="電話"
              type="text"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="user.gender"
              :items="[
                { key: '男', value: 'male' },
                { key: '女', value: 'female' },
                { key: '不公開', value: 'hide' },
              ]"
              label="性別*"
              item-text="key"
              item-value="value"
              hide-details="true"
              required
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6">
            <v-dialog
              ref="birthSelEl"
              v-model="birthSel"
              :return-value.sync="user.birth"
              persistent
              width="290px"
            >
              <template #activator="{ on, attrs }">
                <v-text-field
                  v-model="user.birth"
                  label="生日"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker v-model="user.birth" locale="zh-tw" scrollable>
                <v-spacer></v-spacer>
                <v-btn text color="primary" @click="birthSel = false"
                  >取消</v-btn
                >
                <v-btn
                  text
                  color="primary"
                  @click="$refs.birthSelEl.save(user.birth)"
                  >選擇</v-btn
                >
              </v-date-picker>
            </v-dialog>
          </v-col>
          <small>*為必填欄位</small>
        </v-row>
        <v-row class="mb-5 mx-md-3">
          <v-col class="d-flex justify-center" cols="12">
            <v-btn color="primary" class="mr-4" @click="register(user)"
              >註冊</v-btn
            >
            <v-btn color="accent" @click="reset">清除</v-btn>
          </v-col>
          <v-col class="d-flex justify-center pb-0" cols="12">
            <v-btn color="primary" text to="/login">有帳號了？登入</v-btn>
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
      pageTitle: '註冊',
      user: {
        account: '',
        password: '',
        passwordConfirm: '',
        name: '',
        phone: '',
        gender: 'male',
        birth: null,
      },
      birthSel: false,
      rules: {
        validNumber: (v) => v > 0 || '必須大於0',
        validNullString: (v) => !!v || '不能為空',
      },
    }
  },
  created() {
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions(['register']),
    reset() {
      this.user.username = this.user.password = ''
    },
  },
}
</script>
