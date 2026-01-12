---
title: "Implementing Auto Refresh on AVEVA InTouch Alarm Database Viewer"
date: "2024-07-18"
slug: "aveva-intouch-alarm-auto-refresh"
description: "Learn how to implement automatic refresh functionality for the Alarm Database Viewer in AVEVA InTouch SCADA systems to improve monitoring efficiency."
tags: ["SCADA", "AVEVA", "InTouch", "Automation", "Alarm Management"]
author: "Fajar Yuda Pratama"
published: true
featured: false
---

# Implementing Auto Refresh on AVEVA InTouch Alarm Database Viewer

In AVEVA InTouch SCADA systems, managing the alarm history display is one of the crucial aspects to ensure operators can effectively monitor system conditions. The need to display the latest alarms along with alarm history from the database poses a particular challenge in monitoring system implementation.

## Understanding Alarm Viewer Components

AVEVA InTouch provides two main components for displaying alarms: Alarm Viewer and Alarm DB Viewer. These components have different characteristics in displaying alarm data. Alarm Viewer is designed to display alarms that occur in real-time, so whenever a new alarm appears, the information will immediately show up on the screen without manual intervention. However, this component does not store past alarm history.

On the other hand, Alarm DB Viewer functions to display alarms that are stored in the database. The limitation of this component is the absence of an auto-refresh feature, requiring operators to manually refresh to see the latest data. This is certainly inefficient for operations that require continuous monitoring.

## Solution Approach

To optimize the use of both components, the approach implemented is to place the Alarm Viewer in the footer of every screen. This way, operators can always see the real-time alarm list at the bottom of the screen, regardless of which page is currently open. For dedicated alarm monitoring pages, Alarm DB Viewer is used so operators can view the complete alarm history, both past and recent.

## Implementing Auto Refresh

The main challenge is how to make the Alarm DB Viewer display the latest data automatically without requiring manual refresh by the operator. The solution is to create a script that performs periodic data reload at specific time intervals. The script used is quite simple:

```
#AlarmDBViewCtrl1.Refresh();
```

To implement this script, follow these steps:

First, open the script editor by right-clicking on the Script menu, then select New Script and choose Application Script.

![[Pasted image 20240718152402.png]]

After the script editor window opens, enter the script above and set the execution interval in milliseconds according to system requirements. The appropriate interval will ensure alarm data is always updated without burdening system performance.

![[Pasted image 20240718152610.png]]

With this implementation, operators no longer need to manually refresh the Alarm DB Viewer. Alarm data will be updated automatically according to the specified interval, thus improving monitoring efficiency and ensuring no important alarms are missed.