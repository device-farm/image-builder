FROM ubuntu AS cross

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

######################################################

WORKDIR /build
RUN git clone -c advice.detachedHead=false --depth 1 -b ${UBOOT_VERSION} ${UBOOT_REPO}

WORKDIR /build/u-boot

RUN make ${UBOOT_DEFCONFIG}
RUN make

######################################################

WORKDIR /build
RUN git clone -c advice.detachedHead=false --depth 1 -b ${LINUX_VERSION} ${LINUX_REPO}

WORKDIR /build/linux

RUN make ${LINUX_DEFCONFIG}
RUN make

######################################################

WORKDIR /build
COPY boot.cmd ./
RUN mkimage -C none -A ${ARCH} -T script -d boot.cmd boot.scr
