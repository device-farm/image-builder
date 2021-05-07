setenv bootargs console=ttyS0,115200 root=/dev/mmcblk0p1 rw,noatime rootwait panic=10
load mmc 0:1 ${fdt_addr_r} boot/dt.dtb
load mmc 0:1 ${kernel_addr_r} boot/zImage
bootz ${kernel_addr_r} - ${fdt_addr_r}
