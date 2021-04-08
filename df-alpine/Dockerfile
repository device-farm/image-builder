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
