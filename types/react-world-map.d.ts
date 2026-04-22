declare module "react-world-map" {
  import { FC } from "react";

  type CountryValue = {
    country: string;
    value: number;
  };

  type WorldMapProps = {
    value: CountryValue[];
    size?: "responsive" | "xl" | "xxl" | "sm";
    color?: string;
    tooltipBgColor?: string;
    tooltipTextColor?: string;
    backgroundColor?: string;
  };

  const WorldMap: FC<WorldMapProps>;
  export default WorldMap;
}
