FROM ubuntu

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
    u-boot-tools

######################################################

WORKDIR /build
RUN git clone https://github.com/u-boot/u-boot.git

WORKDIR /build/u-boot

ENV CROSS_COMPILE=arm-linux-gnueabihf-

RUN make orangepi_zero_defconfig
RUN make

######################################################

WORKDIR /build

RUN mkdir mount-boot
RUN mkdir mount-system

COPY stage1 stage2 boot.cmd ./
RUN mkimage -C none -A arm -T script -d boot.cmd boot.scr

######################################################

