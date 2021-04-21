# these two args need to be on top since they control FROM command
ARG ROOT_CONTAINER_PLATFORM
ARG ROOT_CONTAINER_IMAGE

######################################################
#   cross compiler                                   #
######################################################

FROM ubuntu AS cc-stage

ARG GCC_ARCH
ARG GCC_CROSS_COMPILE
ARG UBOOT_DEFCONFIG
ARG UBOOT_REPO
ARG UBOOT_VERSION
ARG LINUX_DEFCONFIG
ARG LINUX_REPO
ARG LINUX_VERSION

ENV ARCH=${GCC_ARCH}
ENV CROSS_COMPILE=${GCC_CROSS_COMPILE}

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

COPY linux-defconfig .
RUN cat linux-defconfig >>arch/${ARCH}/configs/${LINUX_DEFCONFIG}; rm linux-defconfig

RUN make ${LINUX_DEFCONFIG}
RUN make

######################################################
#   root file system                                 #
######################################################

FROM --platform=${ROOT_CONTAINER_PLATFORM} ${ROOT_CONTAINER_IMAGE} AS root-stage

COPY root-container-install ./
RUN ./root-container-install
RUN rm ./root-container-install

######################################################
#   installer image                                  #
######################################################

FROM alpine:latest AS installer-stage

RUN apk add sfdisk e2fsprogs

WORKDIR /build

ARG LINUX_DT_NAME

COPY --from=root-stage / copy-root/
COPY root copy-root/
#COPY --from=kernel-stage /build/linux/arch/arm/boot/zImage copy-root/boot/zImage
#COPY --from=kernel-stage /build/linux/arch/arm/boot/dts/${LINUX_DT_NAME}.dtb copy-root/boot/dt.dtb
#COPY --from=uboot-stage /build/boot.scr copy-root/boot/boot.scr
#COPY --from=uboot-stage /build/u-boot/*.bin u-boot/
#COPY --from=uboot-stage /build/u-boot/*.dtb u-boot/

COPY install-* ./
