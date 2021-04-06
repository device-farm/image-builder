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

ENV ARCH=arm 
RUN make sunxi_defconfig
RUN make 

######################################################

WORKDIR /build
#RUN git clone https://git.busybox.net/busybox/

#WORKDIR /build/busybox

#RUN make defconfig
#RUN make install

RUN apt-get install -y curl
WORKDIR /build/alpine
RUN curl https://dl-cdn.alpinelinux.org/alpine/v3.13/releases/armv7/alpine-minirootfs-3.13.4-armv7.tar.gz | tar -xvz


######################################################

WORKDIR /build

RUN mkdir mount-root

COPY copy-root ./copy-root
COPY stage1 stage2 boot.cmd ./
RUN mkimage -C none -A arm -T script -d boot.cmd boot.scr

######################################################

