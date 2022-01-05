# Luci App Simple Clash

## Description

LuCI support for Clash. Configuration of clash based on https://github.com/chandelures/openwrt-clash to build your tunnel on Openwrt.

## Installation

### Manual Install

1. Download Openwrt Source Code or SDK as the basic enviroment to build the package.

```shell
$ git clone https://github.com/openwrt/openwrt
$ cd openwrt

# or 

$ wget https://downloads.openwrt.org/path/to/openwrt-sdk_*.tar.xz
$ tar -Jxvf openwrt-sdk_*.tar.xz
$ cd openwrt-sdk_*
```

2. Prepare build environment

```shell
$ ./scripts/feeds update -a
$ ./scripts/feeds install -a

$ git clone https://github.com/chandelures/openwrt-clash package/openwrt-clash
$ git clone https://github.com/chandelures/luci-app-simple-clash package/luci-app-simple-clash
```

3. Choose clash as a module or built-in module

```shell
$ make menuconfig

...

LuCI  --->
    Applications  --->
        <M> luci-app-simple-clash

...

```

4. Build packages
```shell
$ make package/luci-app-simple-clash/{clean,compile} V=s
```
