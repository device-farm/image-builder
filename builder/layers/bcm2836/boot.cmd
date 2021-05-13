setenv bootargs console=tty1 console=ttyAMA0,115200 root=/dev/mmcblk0p2 rw,noatime rootwait panic=10
fatload mmc 0 ${fdt_addr_r} dtb
fatload mmc 0 ${kernel_addr_r} zImage
bootz ${kernel_addr_r} - ${fdt_addr_r}
