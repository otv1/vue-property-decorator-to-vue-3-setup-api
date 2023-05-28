<template>
  <h1>Hello {{ world }}</h1>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({
  name: "HelloWorld",
  components: {},
})
export default class TestComponent extends Vue {
  @VModel({ type: Boolean, required: true, default: false }) name!: boolean;

  @Prop({ type: String }) readonly myProp!: string;
  @Prop({ type: String, required: true }) readonly myProp2!: string;
  @Prop({ type: String, default: "test" })
  readonly myProp3!: string;
  @Prop({ type: String, required: true, default: "test" })
  readonly myProp4!: string;
  @Prop({ default: "test" }) readonly myProp5!: string;
  @Prop({ type: Boolean, default: true }) readonly myProp6!: boolean;

  @PropSync("name", { type: String, default: "test" }) syncedName!: string;

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
