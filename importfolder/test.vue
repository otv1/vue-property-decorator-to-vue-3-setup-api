<template>
  <h1>Hello {{ world }}</h1>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({
  name: "HelloWorld",
  components: {},
})
export default class DashboardManage extends Vue {
  @VModel({ type: String }) name!: string;

  @Prop({ type: String })
  readonly myProp!: string;

  world = "World";

  get today(): string {
    return "today";
  }

  UpdateWorld(data: string): void {
    this.world = data;
  }
}
</script>
<style scoped></style>
