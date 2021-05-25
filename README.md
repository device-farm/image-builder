# image-builder

## QEMU
sudo kvm -m 1024 -kernel ~/tmp/bzImage -append "root=/dev/sda2 console=ttyS0" -serial stdio -display none -hda /dev/mmcblk0

## TODO:

### image-builder
- install kernel modules to fs

### device.farm

