---
title: "Building Offline-First Apps for Bangladesh"
date: 2026-09-10
category: apps
excerpt: "Why my apps work without the internet, keep data on the phone and speak Bangla first, and the design and engineering choices that follow."
cover: /blog/media/covers/offline-first-apps-bangladesh.jpg
cover_alt: "A phone outline with a crossed-out cloud above it and a small local database below."
tags: [App Development, Offline-First, Privacy, Bangla, Flutter, Kotlin]
draft: false
---

Every app I've released has the same three rules: it works without the internet, the user's data stays on their phone, and it treats Bangla as a first-class language rather than a translation added at the end.

None of these rules came from a design principle I read somewhere. They came from watching how people around me actually use their phones. This post explains why I build this way and what it changes in the design and the code, using two of my apps as examples: **Taka**, a personal finance manager, and **TaskBell**, a task manager with alarm reminders.

## Why offline-first

"Offline-first" means the app is designed to work fully without a network connection. Syncing or online features, if they exist at all, are extras on top of an app that already works.

For many users in Bangladesh, that matters for practical reasons:

- **Connectivity is uneven.** Mobile data can be slow or patchy outside city centres, inside buildings, or during busy times.
- **Data costs money.** People are careful about what eats their data pack.
- **Phones are shared and storage is tight.** Many users run budget Android phones with little free space, so a light app that doesn't download content constantly is easier to keep.
- **Trust is low for apps that ask for accounts.** A money app that wants your phone number, email and a sign-up before you can record your first expense loses people at the first screen.

An app that opens instantly, works in a basement and doesn't ask for an account removes all of those problems at once.

## Privacy as a feature, not a policy page

Both Taka and TaskBell keep data on the device. TaskBell goes further and doesn't request the internet permission at all, which means it physically can't send your tasks anywhere. There's no account, no ads and no analytics.

This is a design decision as much as an engineering one. When an app records your savings, loans and bKash balance, or your private reminders and contacts, the safest data is data that never leaves the phone. It also makes the app much simpler to build and maintain. There's no server to pay for, no database to secure, and no breach to apologise for.

The trade-off is that the user becomes responsible for their own backup. So backup has to be easy. In TaskBell, a single backup file is saved to a folder the user chooses, and restoring shows a preview of what's inside before anything is overwritten. In Taka, the same idea applies: the user owns the file and decides where it goes.

## Designing for Bangla first

Supporting Bangla is not just translating strings. It affects layout, typography and even the words you choose.

- **Text length changes.** A button label that fits in English may wrap in Bangla, or the other way round. I design layouts that can grow instead of fixing widths to the English text.
- **Script needs room.** Bangla letters have marks above and below the main line, and conjuncts can be tall. Line height that looks fine for English can clip Bangla.
- **Numbers matter.** In a finance app, people expect to see Bangla digits (০১২৩…) when they choose Bangla, and amounts in the local grouping style. Taka handles amounts like ৳3,46,064.75 rather than forcing Western grouping.
- **Words should be familiar.** Financial terms like DPS, Sanchayapatra and FDR are what people actually say. Using the everyday term is better than a literal translation nobody uses.

I go deeper into setting Bangla and English together in [Designing Bilingual Brands](/blog/designing-bilingual-brands/).

## Building for the local context

Offline-first also means thinking about what people actually need to track. Taka isn't a generic budgeting app with a Bangladeshi flag on it. It handles cash, bKash, Nagad, bank accounts, DPS, Sanchayapatra, loans given and taken, and insurance, because that's what a household's money really looks like here.

The lesson generalises: the more specific your app is to the people using it, the less it needs to explain itself.

## The engineering choices that follow

Once you commit to offline-first, several technical decisions become obvious.

**The local database is the source of truth.** Everything the user sees comes from a database on the device. Screens read from it, actions write to it, and nothing waits on a network request.

**Every write must be safe.** If the phone dies mid-save, the data must still be consistent. That means transactions for anything that touches more than one record, and careful migrations when the database structure changes between versions.

**Migrations need testing.** Users can skip versions. A user going from version 0.2 to 0.9 has to land on the correct database schema without losing anything. I keep migrations small and test upgrades from older versions, not just fresh installs.

**Background work has to respect the OS.** TaskBell's whole purpose is to ring at the right time, so it has to work with Android's alarm and battery rules rather than against them. That deserves its own post: [Making Alarms Reliable on Android](/blog/reliable-alarms-on-android/).

**Updates still need a channel.** Without an app store or a server, users still need to find out about new versions. My apps are distributed as APKs from GitHub Releases, with a simple update check and a release page that explains what changed. TaskBell's site and Taka's site both live on this domain.

## The tools

I've used different stacks for different apps. Taka is built with Flutter, which made it practical to design a polished, consistent interface and handle Bangla and English from a single codebase. TaskBell is written in Kotlin as a native Android app, because alarms, notifications and lock-screen behaviour are deeply tied to Android itself, and native code gives the most control over them.

The choice of framework matters less than the principles. If the app works offline, stores data locally and is built for the language and context of its users, the framework is just the way you get there.

## What I'd tell someone starting out

1. **Decide early what must work offline.** Usually the answer is "everything the user does every day".
2. **Treat privacy as a product feature.** Fewer permissions and no account are selling points, so say so clearly.
3. **Design for Bangla from the first sketch,** not after the English version is finished.
4. **Make backup and restore boring and safe.** If users own their data, they need an easy way to protect it.
5. **Test on cheap phones.** If it runs well on a budget device, it runs well everywhere.

Building this way is slower at the start, but it produces apps that people can trust on the first day and keep using for years.
