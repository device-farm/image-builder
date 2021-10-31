# image-builder

## docker buildx setup
```sh
docker run --privileged --rm tonistiigi/binfmt --install arm
docker buildx create --name cross --platform linux/amd64,linux/arm64,linux/arm/v7,linux/arm/v6
docker buildx use cross
```

## Linux stage
1. Linux preparation:
   - clone Linux
   - apply linux.patch
   - copy `arch/${LINUX_ARCH}/configs/${LINUX_DEFCONFIG}` to `arch/${LINUX_ARCH}/configs/my_defconfig`   
   - arm64: set all CONFIG_ARCH_*=n in `my_defconfig`
2. defconfig customization
   - append `linux-defconfig` to `my_defconfig`
   - scan and append CONFIG_EXTRA_FIRMWARE to `my_defconfig`
3. defconfig resolution
   - `make my_defconfig mod2yesconfig`
4. actual make
   - `make`

## QEMU
sudo kvm -m 1024 -kernel ~/tmp/bzImage -append "root=/dev/sda2 console=ttyS0" -serial stdio -display none -hda /dev/mmcblk0

## TODO:

### image-builder
- install kernel modules to fs

### device.farm

