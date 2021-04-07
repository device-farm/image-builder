FROM ubuntu AS cross

######################################################

RUN apt-get update
RUN apt-get install -y \
    git \
    build-essential \
    gcc-arm-linux-gnueabihf \
    bison \
    flex \
    swig \
    python3-pip \
    python3-distutils \
    bc \
    util-linux \
    dosfstools \
    u-boot-tools \
    curl

ENV ARCH=arm 
ENV CROSS_COMPILE=arm-linux-gnueabihf-

######################################################

WORKDIR /build
RUN git clone https://github.com/u-boot/u-boot.git

WORKDIR /build/u-boot

RUN make orangepi_zero_defconfig
RUN make

######################################################

WORKDIR /build
RUN git clone https://github.com/torvalds/linux.git

WORKDIR /build/linux

RUN make sunxi_defconfig
RUN make 

######################################################

WORKDIR /build
COPY boot.cmd ./
RUN mkimage -C none -A arm -T script -d boot.cmd boot.scr

######################################################

FROM --platform=linux/arm/v7 alpine:3.12 AS root
RUN apk add alpine-base dhcp dropbear mc tree

RUN \
    rc-update add devfs sysinit && \
    rc-update add mdev sysinit && \
    rc-update add bootmisc boot && \
    rc-update add hostname boot && \
    rc-update add hwclock boot && \
    rc-update add loopback boot && \
    rc-update add networking boot && \
    rc-update add syslog boot && \
    rc-update add mount-ro shutdown && \
    rc-update add killprocs shutdown && \
    rc-update add savecache shutdown && \
    rc-update add dropbear default

RUN echo 'SYSLOGD_OPTS="-t -K"' >/etc/conf.d/syslog

COPY inittab /etc/inittab

######################################################

FROM alpine

RUN apk add sfdisk e2fsprogs

WORKDIR /build

COPY --from=root / copy-root/
COPY --from=cross /build/linux/arch/arm/boot/dts/sun8i-h2-plus-orangepi-zero.dtb /build/linux/arch/arm/boot/zImage /build/boot.scr copy-root/boot/
COPY --from=cross /build/u-boot/u-boot-sunxi-with-spl.bin ./ 
COPY step1 step2 ./ 
