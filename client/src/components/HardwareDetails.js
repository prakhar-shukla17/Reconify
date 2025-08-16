"use client";

import { useState } from "react";
import {
  Monitor,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Battery,
  Thermometer,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

const HardwareDetails = ({ hardware }) => {
  const [expandedSections, setExpandedSections] = useState({
    system: true,
    cpu: false,
    memory: false,
    storage: false,
    graphics: false,
    network: false,
    motherboard: false,
    power: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const InfoCard = ({ title, children, icon: Icon, sectionKey }) => (
    <div className="bg-white rounded-lg shadow-sm border">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-6 pb-4">{children}</div>
      )}
    </div>
  );

  const DataRow = ({ label, value, className = "" }) => (
    <div className={`flex justify-between py-2 ${className}`}>
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium text-gray-900">{value || "Unknown"}</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Monitor className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {hardware.system?.hostname || "Unknown Device"}
            </h1>
            <p className="text-gray-600">
              {hardware.system?.platform} {hardware.system?.platform_release} •
              MAC: {hardware.system?.mac_address}
            </p>
          </div>
        </div>
      </div>

      {/* System Information */}
      <InfoCard title="System Information" icon={Info} sectionKey="system">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DataRow label="Platform" value={hardware.system?.platform} />
            <DataRow
              label="Release"
              value={hardware.system?.platform_release}
            />
            <DataRow
              label="Version"
              value={hardware.system?.platform_version}
            />
            <DataRow
              label="Architecture"
              value={hardware.system?.architecture}
            />
          </div>
          <div>
            <DataRow label="Hostname" value={hardware.system?.hostname} />
            <DataRow label="Processor" value={hardware.system?.processor} />
            <DataRow label="Boot Time" value={hardware.system?.boot_time} />
            <DataRow label="Uptime" value={hardware.system?.uptime} />
          </div>
        </div>
      </InfoCard>

      {/* CPU Information */}
      <InfoCard title="CPU Information" icon={Cpu} sectionKey="cpu">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DataRow label="Name" value={hardware.cpu?.name} />
            <DataRow label="Manufacturer" value={hardware.cpu?.manufacturer} />
            <DataRow label="Architecture" value={hardware.cpu?.architecture} />
            <DataRow
              label="Physical Cores"
              value={hardware.cpu?.physical_cores}
            />
            <DataRow
              label="Logical Cores"
              value={hardware.cpu?.logical_cores}
            />
          </div>
          <div>
            <DataRow
              label="Max Frequency"
              value={hardware.cpu?.max_frequency}
            />
            <DataRow
              label="Min Frequency"
              value={hardware.cpu?.min_frequency}
            />
            <DataRow
              label="Current Frequency"
              value={hardware.cpu?.current_frequency}
            />
            <DataRow label="L2 Cache" value={hardware.cpu?.l2_cache} />
            <DataRow label="L3 Cache" value={hardware.cpu?.l3_cache} />
          </div>
        </div>
      </InfoCard>

      {/* Memory Information */}
      <InfoCard
        title="Memory Information"
        icon={MemoryStick}
        sectionKey="memory"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <DataRow label="Total" value={hardware.memory?.total} />
            <DataRow label="Available" value={hardware.memory?.available} />
            <DataRow label="Used" value={hardware.memory?.used} />
            <DataRow label="Usage" value={hardware.memory?.percentage} />
          </div>
          <div>
            <DataRow label="Type" value={hardware.memory?.type} />
            <DataRow label="Speed" value={hardware.memory?.speed} />
            <DataRow label="Slot Count" value={hardware.memory?.slot_count} />
            <DataRow label="Swap Total" value={hardware.memory?.swap_total} />
          </div>
        </div>

        {hardware.memory?.slots?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Memory Slots</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hardware.memory.slots.map((slot, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm">
                    <DataRow
                      label="Capacity"
                      value={slot.capacity}
                      className="text-xs"
                    />
                    <DataRow
                      label="Speed"
                      value={slot.speed}
                      className="text-xs"
                    />
                    <DataRow
                      label="Type"
                      value={slot.type}
                      className="text-xs"
                    />
                    <DataRow
                      label="Manufacturer"
                      value={slot.manufacturer}
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </InfoCard>

      {/* Storage Information */}
      <InfoCard
        title="Storage Information"
        icon={HardDrive}
        sectionKey="storage"
      >
        <div className="mb-4">
          <DataRow
            label="Total Capacity"
            value={hardware.storage?.total_capacity}
          />
        </div>

        {hardware.storage?.drives?.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Storage Drives</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hardware.storage.drives.map((drive, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <DataRow label="Model" value={drive.model} />
                  <DataRow label="Size" value={drive.size} />
                  <DataRow label="Media Type" value={drive.media_type} />
                  <DataRow label="Interface" value={drive.interface} />
                </div>
              ))}
            </div>
          </div>
        )}

        {hardware.storage?.partitions?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Partitions</h4>
            <div className="space-y-3">
              {hardware.storage.partitions.map((partition, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DataRow label="Device" value={partition.device} />
                    <DataRow label="Mount Point" value={partition.mountpoint} />
                    <DataRow label="Filesystem" value={partition.filesystem} />
                    <DataRow label="Usage" value={partition.percentage} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </InfoCard>

      {/* Graphics Information */}
      {hardware.graphics?.gpus?.length > 0 && (
        <InfoCard
          title="Graphics Information"
          icon={Monitor}
          sectionKey="graphics"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hardware.graphics.gpus.map((gpu, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  GPU {index + 1}
                </h4>
                <DataRow label="Name" value={gpu.name} />
                <DataRow
                  label="Memory"
                  value={gpu.memory || gpu.memory_total}
                />
                <DataRow label="Driver Version" value={gpu.driver_version} />
                <DataRow label="Temperature" value={gpu.temperature} />
                <DataRow label="Load" value={gpu.load} />
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Network Information */}
      <InfoCard title="Network Information" icon={Wifi} sectionKey="network">
        {hardware.network?.interfaces?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hardware.network.interfaces.map((networkInterface, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {networkInterface.name}
                </h4>
                <DataRow
                  label="Status"
                  value={networkInterface.is_up ? "Up" : "Down"}
                />
                <DataRow label="Speed" value={networkInterface.speed} />
                <DataRow
                  label="MAC Address"
                  value={networkInterface.mac_address}
                />
                {networkInterface.addresses?.map((addr, addrIndex) => (
                  <DataRow
                    key={addrIndex}
                    label={addr.type}
                    value={addr.address}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No network interfaces found</p>
        )}
      </InfoCard>

      {/* Motherboard Information */}
      <InfoCard
        title="Motherboard Information"
        icon={Zap}
        sectionKey="motherboard"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DataRow
              label="Manufacturer"
              value={hardware.motherboard?.manufacturer}
            />
            <DataRow label="Model" value={hardware.motherboard?.model} />
            <DataRow label="Version" value={hardware.motherboard?.version} />
            <DataRow
              label="Serial Number"
              value={hardware.motherboard?.serial_number}
            />
          </div>
          {hardware.motherboard?.bios && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                BIOS Information
              </h4>
              <DataRow
                label="Manufacturer"
                value={hardware.motherboard.bios.manufacturer}
              />
              <DataRow
                label="Version"
                value={hardware.motherboard.bios.version}
              />
              <DataRow
                label="Release Date"
                value={hardware.motherboard.bios.release_date}
              />
            </div>
          )}
        </div>
      </InfoCard>

      {/* Power & Thermal Information */}
      {(hardware.power_thermal?.battery ||
        hardware.power_thermal?.temperatures) && (
        <InfoCard
          title="Power & Thermal Information"
          icon={Battery}
          sectionKey="power"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hardware.power_thermal.battery && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Battery</h4>
                <DataRow
                  label="Charge"
                  value={hardware.power_thermal.battery.percent}
                />
                <DataRow
                  label="Power"
                  value={
                    hardware.power_thermal.battery.power_plugged
                      ? "Plugged In"
                      : "On Battery"
                  }
                />
                <DataRow
                  label="Time Left"
                  value={hardware.power_thermal.battery.time_left}
                />
              </div>
            )}

            {hardware.power_thermal.temperatures && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Temperature Sensors
                </h4>
                {Object.entries(hardware.power_thermal.temperatures).map(
                  ([sensor, readings]) => (
                    <div key={sensor} className="mb-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">
                        {sensor}
                      </h5>
                      {readings.map((reading, index) => (
                        <div key={index} className="text-sm">
                          <DataRow
                            label={reading.label}
                            value={`${reading.current} (High: ${reading.high}, Critical: ${reading.critical})`}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </InfoCard>
      )}
    </div>
  );
};

export default HardwareDetails;
