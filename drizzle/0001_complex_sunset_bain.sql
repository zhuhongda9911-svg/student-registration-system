CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`contactPerson` varchar(100),
	`contactPhone` varchar(20),
	`contactWechat` varchar(100),
	`itinerary` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`paymentMethod` varchar(50) NOT NULL,
	`transactionId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'CNY',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentData` text,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_registrationId_unique` UNIQUE(`registrationId`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`studentName` varchar(100) NOT NULL,
	`studentGender` enum('男','女') NOT NULL,
	`studentSchool` varchar(200) NOT NULL,
	`studentGrade` varchar(50) NOT NULL,
	`studentClass` varchar(50) NOT NULL,
	`studentIdCard` varchar(18),
	`guardianName` varchar(100) NOT NULL,
	`guardianPhone` varchar(20) NOT NULL,
	`emergencyContactName` varchar(100),
	`emergencyContactPhone` varchar(20),
	`remarks` text,
	`paymentStatus` enum('pending','paid','refunded') NOT NULL DEFAULT 'pending',
	`paymentAmount` decimal(10,2) NOT NULL,
	`ipAddress` varchar(50),
	`location` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`)
);
