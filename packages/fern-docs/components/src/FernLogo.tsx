import { ComponentPropsWithoutRef, forwardRef } from "react";

import { cn } from "./cn";

export enum FernLogoFill {
  /**
   * The leaf color is fern (green), and the text color is ground in light mode or air in dark mode
   */
  Default = "default",

  /**
   * The entire logo is fern (green)
   */
  Fern = "fern",

  /**
   * The entire logo is monochrome — either ground in light mode or air in dark mode
   */
  Mono = "mono",

  /**
   * The entire logo is grayscale-a10
   */
  Muted = "muted",

  /**
   * The leaf color is fern (green), and the text color is air (white)
   */
  FernAir = "fern-air",

  /**
   * The leaf color is fern (green), and the text color is ground (black)
   */
  FernGround = "fern-ground",

  /**
   * The entire logo is air (white)
   */
  Air = "air",

  /**
   * The entire logo is ground (black)
   */
  Ground = "ground",
}

export declare namespace FernLogo {
  export interface Props {
    className?: string;
    fill?: FernLogoFill;
    variant?: "default" | "leaf-only";
  }
}

export const FernLogo = forwardRef<
  SVGSVGElement,
  ComponentPropsWithoutRef<"svg"> & { fill?: FernLogoFill; variant?: "default" | "leaf-only" }
>(({ fill = FernLogoFill.Default, variant = "default", ...props }, ref) => {
  if (variant === "leaf-only") {
    return (
      <svg
        ref={ref}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
        style={{
          aspectRatio: "1/1",
          ...props.style,
        }}
      >
        <path
          d="M321.795 196.783C302.052 180.094 272.31 173.404 245.95 192.887C244.737 193.769 243.23 192.262 244.149 191.086C250.399 183.035 257.641 174.36 263.487 165.648C269.443 156.715 278.34 150.319 288.597 147.194C343.192 130.652 326.795 50 326.795 50C326.795 50 242.458 55.4405 252.862 128.189C254.59 140.357 251.355 152.745 243.745 162.413C234.407 174.213 223.561 185.498 215.694 193.659C214.039 195.35 211.245 193.732 211.907 191.453C219.517 165.831 225.068 126.204 198.709 100.656L161.614 69.8505L154.481 79.2611C133.268 107.236 139.482 146.679 167.496 167.853C183.562 179.984 190.841 193.181 189.701 207.664C189.003 216.34 185.069 224.464 179.187 230.897C168.121 243.028 157.79 256.041 149.812 271.113C148.709 273.208 145.511 272.399 145.621 270.01C146.761 245.123 144.371 189.027 102.46 168.993L55.5492 150.87L51.9095 161.714C40.1082 196.71 59.4094 234.095 94.3721 245.969C124.776 256.298 135.621 275.891 128.305 305.263C127.974 306.329 122.68 336.583 123.416 350H157.128C158.268 329.194 180.106 315.519 199.039 324.011C204.37 326.4 209.848 329.819 215.473 334.23C245.62 357.977 290.031 352.353 313.743 322.173L320.508 313.571L277.862 282.949C248.597 259.938 209.554 270.341 180.657 290.044C178.231 291.698 175.143 289.052 176.503 286.405C211.429 217.884 256.833 218.031 274.626 233.25C296.207 251.703 328.89 248.395 347.199 226.743L352.456 220.531L321.758 196.783H321.795Z"
          className={cn({
            "fill-fern":
              fill === FernLogoFill.Default ||
              fill === FernLogoFill.Fern ||
              fill === FernLogoFill.FernAir ||
              fill === FernLogoFill.FernGround,
            "fill-fern-air": fill === FernLogoFill.Air,
            "fill-fern-ground": fill === FernLogoFill.Ground,
            "fill-fern-ground dark:fill-fern-air": fill === FernLogoFill.Mono,
            "fill-(color:--grayscale-a10)": fill === FernLogoFill.Muted,
          })}
        />
      </svg>
    );
  }

  return (
    <svg
      ref={ref}
      viewBox="0 0 604 164"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      style={{
        aspectRatio: "604/164",
        ...props.style,
      }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M295.294 0H255.861H255.836C234.047 0 221.437 11.4661 221.437 33.483V47.2372H193.242V75.2033H221.437V160.5H253.547V75.2033H288.404V47.2372H253.547V37.3728C253.547 30.7118 257.208 27.9661 263.87 27.9661H295.294V0ZM345.26 43.8081C311.777 43.8081 288.844 67.1979 288.844 103.198H288.87C288.87 139.884 311.802 163.96 346.43 163.96C375.311 163.96 392.727 149.291 399.388 126.816H366.591C363.591 133.02 356.955 137.367 346.633 137.367C331.277 137.367 321.87 129.562 320.497 115.35H400.761C401.219 110.545 401.447 106.401 401.447 102.283C401.447 66.2826 378.744 43.8081 345.26 43.8081ZM369.108 90.5877V91.0453H320.269C321.184 77.7487 329.675 69.0284 345.26 69.0284C360.845 69.0284 369.108 77.7487 369.108 90.5877ZM412.668 47.2321H440.863V67.1898C443.609 54.3508 452.787 47.2321 467.227 47.2321H487.414V51.122C487.414 64.4186 476.634 75.1982 463.338 75.1982C450.727 75.1982 444.753 81.6304 444.753 94.4694V160.52H412.642V47.2321H412.668ZM526.939 47.24H498.744H498.719V160.503H530.829V96.0789C530.829 81.6382 539.321 72.6891 552.16 72.6891C564.999 72.6891 571.889 80.0366 571.889 95.1637V160.528H604V91.7315C604 61.7061 586.559 43.8078 558.821 43.8078C545.753 43.8078 533.601 48.8417 526.939 58.7061V47.24Z"
        className={cn({
          "fill-fern": fill === FernLogoFill.Fern,
          "fill-air":
            fill === FernLogoFill.Air || fill === FernLogoFill.FernAir,
          "fill-fern-ground":
            fill === FernLogoFill.Ground || fill === FernLogoFill.FernGround,
          "fill-fern-ground dark:fill-fern-air":
            fill === FernLogoFill.Default || fill === FernLogoFill.Mono,
          "fill-(color:--grayscale-a10)": fill === FernLogoFill.Muted,
        })}
      />
      <path
        d="M149.383 80.2222C138.594 71.101 122.341 67.4445 107.936 78.0925C107.273 78.5747 106.449 77.751 106.952 77.1081C110.367 72.7082 114.325 67.9668 117.519 63.2053C120.774 58.3233 125.636 54.8275 131.241 53.1198C161.076 44.079 152.116 0 152.116 0C152.116 0 106.027 2.97342 111.713 42.7329C112.657 49.3829 110.889 56.1535 106.731 61.4374C101.628 67.8865 95.7008 74.0543 91.4014 78.5144C90.4973 79.4386 88.9705 78.5546 89.3321 77.309C93.4909 63.3058 96.5246 41.648 82.1195 27.685L61.848 10.849L57.9504 15.9922C46.3581 31.2812 49.7534 52.8385 65.0625 64.4108C73.8422 71.0407 77.8201 78.2533 77.1973 86.169C76.8156 90.9104 74.6659 95.3505 71.4514 98.8663C65.4041 105.496 59.7586 112.608 55.3989 120.846C54.7962 121.991 53.0483 121.549 53.1086 120.243C53.7314 106.641 52.4255 75.983 29.5221 65.0336L3.88635 55.1289L1.89737 61.0556C-4.55174 80.182 5.99588 100.614 25.1021 107.104C41.7171 112.749 47.6439 123.457 43.6458 139.51C43.465 140.092 40.572 156.627 40.9738 163.96H59.3969C60.0198 152.589 71.9536 145.115 82.3003 149.756C85.2135 151.062 88.207 152.93 91.2809 155.341C107.755 168.32 132.025 165.246 144.983 148.752L148.68 144.05L125.375 127.315C109.383 114.738 88.0463 120.424 72.255 131.192C70.929 132.096 69.2414 130.65 69.9847 129.203C89.0709 91.7542 113.883 91.8346 123.607 100.152C135.4 110.238 153.261 108.429 163.266 96.5961L166.139 93.2007L149.363 80.2222H149.383Z"
        className={cn({
          "fill-fern":
            fill === FernLogoFill.Default ||
            fill === FernLogoFill.Fern ||
            fill === FernLogoFill.FernAir ||
            fill === FernLogoFill.FernGround,
          "fill-fern-air": fill === FernLogoFill.Air,
          "fill-fern-ground": fill === FernLogoFill.Ground,
          "fill-fern-ground dark:fill-fern-air": fill === FernLogoFill.Mono,
          "fill-(color:--grayscale-a10)": fill === FernLogoFill.Muted,
        })}
      />
    </svg>
  );
});

FernLogo.displayName = "FernLogo";
