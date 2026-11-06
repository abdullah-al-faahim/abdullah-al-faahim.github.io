---
title: "From SDI to IP: What SMPTE ST 2110 Changes for Broadcasters"
date: 2026-10-04
category: broadcast
excerpt: "Broadcast facilities are swapping coaxial cables for network switches. Here is what ST 2110 actually is, why it matters, and what it asks of engineers."
cover: /blog/media/covers/sdi-to-ip-st-2110.jpg
cover_alt: "Round BNC connectors on the left turning into a mesh of network nodes on the right."
tags: [Broadcast, SMPTE ST 2110, IP Video, SDI, PTP]
draft: false
---

For decades, the backbone of every television facility has been a cable you can hold in your hand: a coaxial lead with a BNC connector on each end, carrying SDI (Serial Digital Interface). One cable, one signal, one direction. You can trace it, you can unplug it, and you can be very sure what is on it.

That model is slowly being replaced by something that looks much more like an office network: Ethernet switches, fibre and software. The standard behind most of that change is SMPTE ST 2110. If you work in broadcast, or you're studying to, it's worth understanding what it is and what it changes about the job.

## A quick refresher on SDI

SDI carries uncompressed digital video, embedded audio and ancillary data (timecode, captions, cue messages) over a single coaxial cable. Its data rates have grown with picture formats:

- **SD-SDI** at 270 Mb/s for standard definition.
- **HD-SDI** at about 1.5 Gb/s for 1080i and 720p.
- **3G-SDI** at about 3 Gb/s for 1080p at 50 or 60 frames per second.
- **12G-SDI** at about 12 Gb/s for UHD on a single cable.

SDI's great strength is determinism. A frame goes in one end and comes out the other with almost no delay and no surprises. Its weakness is that everything is point to point. Every new connection needs a physical cable and a port on a large router, and every format upgrade tends to mean new hardware throughout the building.

## What ST 2110 actually is

ST 2110 is a suite of standards for sending professional media over managed IP networks. The key idea is that it does **not** wrap a whole SDI signal into packets. Instead, it splits the signal into its parts and sends each part as its own stream:

- **ST 2110-20** carries uncompressed video.
- **ST 2110-30** carries uncompressed audio, based on the AES67 audio-over-IP standard.
- **ST 2110-40** carries ancillary data, such as captions and timecode.
- **ST 2110-22** allows compressed video (for example JPEG XS) where bandwidth matters.
- **ST 2110-21** defines how evenly packets must be sent so receivers can keep up.

Because video, audio and data are separate, a device can subscribe only to what it needs. An audio console doesn't have to receive and discard gigabits of video just to get a few channels of sound. A graphics engine can take the data stream without the picture.

There was an earlier approach, SMPTE ST 2022-6, that did wrap an entire SDI signal into IP. It's still used in places, but ST 2110's separate "essences" are what most new facilities design around.

## The hard part: time

In an SDI plant, timing is handled by a reference signal distributed to every device. In an IP plant, every device needs to agree on what time it is, very precisely, so that separate video and audio streams can be lined up again at the other end.

ST 2110 relies on the Precision Time Protocol (IEEE 1588), using a broadcast profile defined in SMPTE ST 2059. A grandmaster clock, usually locked to GPS, distributes time across the network, and switches that understand PTP help keep it accurate. When PTP is healthy, everything lines up. When it isn't, you get lip-sync problems, glitches or devices that refuse to lock.

For engineers, this is one of the biggest mindset shifts. Timing stops being a cable you check and becomes a network service you monitor.

## Redundancy, the IP way

Broadcast engineers rightly ask: what happens when a switch fails? The common answer is ST 2022-7 seamless protection switching. Each stream is sent twice over two completely separate networks, often called "red" and "blue". The receiver takes packets from whichever copy arrives intact and rebuilds a clean stream. If one network loses packets or goes down entirely, viewers notice nothing.

It's the IP equivalent of the main and backup chains every Master Control Room already runs, which I described in [Inside a Master Control Room](/blog/inside-a-master-control-room/).

## Finding and connecting things: NMOS

In an SDI world, a router panel tells you which source goes to which destination. In an IP world, there could be thousands of streams on the network. How do you know they exist, and how do you connect them?

That's the job of the AMWA NMOS specifications. **IS-04** lets devices announce themselves and the streams they offer to a registry. **IS-05** gives a standard way to tell a receiver which stream to subscribe to. Together they let a control system behave like a familiar router panel, even though underneath it's managing multicast network traffic.

## Why facilities are moving

ST 2110 is not just "SDI but harder". It brings real benefits:

- **Format flexibility.** HD, UHD and higher frame rates travel over the same network. Upgrading a format is more about bandwidth and software than rewiring.
- **Scale.** A large facility can replace huge SDI routers and bundles of cable with switches and fibre.
- **Software and virtualisation.** Once media is on a network, processing can move into software: playout, graphics, multiviewers and even production switchers running on standard servers.
- **Remote and distributed production.** Studios, control rooms and data centres no longer have to be in the same building.

## What it asks of engineers

The move to IP changes the skill set. Broadcast engineers now need to be comfortable with things that used to belong to the IT team:

- **Networking fundamentals:** VLANs, multicast, IGMP, routing and switch configuration. My background in networking (routing, switching, OSPF, LAN and WAN design) has been far more useful in broadcast than I expected.
- **Bandwidth planning:** a single uncompressed 1080p60 video stream is in the region of 2.5 to 3 Gb/s, so links and switch capacity have to be planned carefully.
- **Monitoring:** tracking packet loss, jitter and PTP health, not just looking at pictures.
- **Security:** a networked plant is a networked attack surface. Segmentation and access control matter.

The good news is that the core broadcast instincts still apply: know your signal path, build redundancy, rehearse failures, and watch what actually goes to air.

## Not everything needs ST 2110

ST 2110 is designed for managed networks inside facilities, where bandwidth is high and timing is controlled. For getting video *between* places over the open internet, other tools fit better: SRT for secure, reliable streaming over unpredictable networks, NDI for convenient video over standard office networks, and bonded cellular systems from vendors such as LiveU and TVU for live reporting from the field.

Many channels, especially smaller ones, will run hybrid facilities for years: SDI where it works well, IP where it brings clear benefits, and gateways in between. That's not a failure to modernise. It's sensible engineering.

## Where to start learning

If you want to get comfortable with broadcast IP:

1. **Learn the networking basics properly.** Multicast and IGMP are the heart of it.
2. **Read the summaries of the ST 2110 parts** and the NMOS IS-04 and IS-05 specs. You don't need to memorise them, just know what each does.
3. **Understand PTP.** Most IP plant problems eventually lead back to timing.
4. **Try it on a small scale.** AES67 audio-over-IP is a cheap way to learn the same ideas with audio before moving on to video.

The cable on the desk is going away, but the job isn't. It's still about getting a clean signal from one place to another, on time, without anyone noticing.
