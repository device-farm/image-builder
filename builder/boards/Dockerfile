######################################################
#   cross compiler                                   #
######################################################

FROM ubuntu AS cc-stage

ARG ARCH
ARG CROSS_COMPILE
ARG UBOOT_DEFCONFIG
ARG UBOOT_REPO
ARG UBOOT_VERSION
ARG LINUX_DEFCONFIG
ARG LINUX_REPO
ARG LINUX_VERSION

ENV ARCH=${ARCH}
ENV CROSS_COMPILE=${CROSS_COMPILE}

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

######################################################
#   u-boot compilation                               #
######################################################

FROM cc-stage AS uboot-stage

WORKDIR /build

RUN git clone -c advice.detachedHead=false --depth 1 -b ${UBOOT_VERSION} ${UBOOT_REPO}

WORKDIR /build/u-boot

RUN make ${UBOOT_DEFCONFIG}
RUN make

WORKDIR /build

COPY boot.cmd ./
RUN mkimage -C none -A ${ARCH} -T script -d boot.cmd boot.scr

######################################################
#   kernel compilation                               #
######################################################

FROM cc-stage AS kernel-stage

WORKDIR /build
RUN git clone -c advice.detachedHead=false --depth 1 -b ${LINUX_VERSION} ${LINUX_REPO}

WORKDIR /build/linux

COPY ext-defconfig-linux .
RUN cat ext-defconfig-linux >>arch/${ARCH}/configs/${LINUX_DEFCONFIG}; rm ext-defconfig-linux

RUN make ${LINUX_DEFCONFIG}
RUN make

######################################################
#   root file system                                 #
######################################################

FROM --platform=linux/arm/v7 alpine:3.12 AS root-stage

RUN apk add \
    alpine-base \
    dhcp \
    wireguard-tools \
    docker \
    iptables \
    ip6tables \
    dropbear \
    mc \
    tree

RUN \
    rc-update add devfs sysinit && \
    rc-update add mdev sysinit && \
    rc-update add bootmisc boot && \
    rc-update add hostname boot && \
    rc-update add hwclock boot && \
    rc-update add loopback boot && \
    rc-update add networking boot && \
    rc-update add cgroups boot && \
    rc-update add syslog boot && \
    rc-update add mount-ro shutdown && \
    rc-update add killprocs shutdown && \
    rc-update add savecache shutdown && \
    rc-update add dropbear default && \
    rc-update add docker default

RUN mkdir /data

RUN echo 'SYSLOGD_OPTS="-t -K"' >/etc/conf.d/syslog
RUN echo 'DOCKER_OPTS="--host=unix:///var/run/docker.sock --host=tcp://127.0.0.7:2375 --data-root=/data/docker"' >/etc/conf.d/docker

COPY inittab /etc/inittab
COPY fstab /etc/fstab

######################################################
#   installer image                                  #
######################################################

FROM alpine:latest AS installer-stage

RUN apk add sfdisk e2fsprogs

WORKDIR /build

ARG LINUX_DT_NAME

COPY --from=root-stage / copy-root/
COPY --from=kernel-stage /build/linux/arch/arm/boot/zImage copy-root/boot/zImage
COPY --from=kernel-stage /build/linux/arch/arm/boot/dts/${LINUX_DT_NAME}.dtb copy-root/boot/dt.dtb
COPY --from=uboot-stage /build/boot.scr copy-root/boot/boot.scr
COPY --from=uboot-stage /build/u-boot/*.bin u-boot/
COPY --from=uboot-stage /build/u-boot/*.dtb u-boot/

# can't be done in root stage where /etc/resolv.conf is mounted from host
RUN echo "nameserver 8.8.8.8" >copy-root/etc/resolv.conf

COPY install-* ./

