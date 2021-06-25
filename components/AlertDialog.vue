<template>
  <v-dialog v-model="show" persistent max-width="290">
    <v-card>
      <v-card-title class="text-h5">{{ alertDialog.title }}</v-card-title>
      <v-card-text>{{ alertDialog.content }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="closeAlertDialog()">
          確認
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
export default {
  computed: {
    ...mapGetters(['alertDialog']),
    show: {
      get() {
        return this.alertDialog.show
      },
      set(val) {
        this.closeAlertDialog()
      },
    },
  },
  methods: {
    ...mapMutations(['closeAlertDialog']),
  },
}
</script>
