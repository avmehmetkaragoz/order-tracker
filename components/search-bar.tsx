"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SearchBarProps {
  onSearch: (search: string, field?: string) => void
}

const searchFields = [
  { value: "all", label: "Tüm Alanlar" },
  { value: "requester", label: "İstek Sahibi" },
  { value: "supplier", label: "Tedarikçi" },
  { value: "customer", label: "Müşteri" },
  { value: "material", label: "Malzeme" },
  { value: "mikron", label: "Mikron" },
  { value: "cm", label: "Genişlik (CM)" },
  { value: "bobinSayisi", label: "Bobin Sayısı" },
  { value: "quantity", label: "Miktar" },
  { value: "notes", label: "Notlar" },
]

export function SearchBar({ onSearch }: SearchBarProps) {
  const [search, setSearch] = useState("")
  const [selectedField, setSelectedField] = useState("all")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(search, selectedField === "all" ? undefined : selectedField)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [search, selectedField, onSearch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const selectedFieldLabel = searchFields.find((f) => f.value === selectedField)?.label || "Tüm Alanlar"

  return (
    <div className="mb-4 space-y-2">
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="shrink-0 bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              {selectedFieldLabel}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {searchFields.map((field) => (
              <DropdownMenuItem
                key={field.value}
                onClick={() => setSelectedField(field.value)}
                className={selectedField === field.value ? "bg-accent" : ""}
              >
                {field.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder={
              selectedField === "all" ? "İstek sahibi, tedarikçi, malzeme ara..." : `${selectedFieldLabel} ara...`
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {selectedField !== "all" && (
        <p className="text-xs text-muted-foreground">
          Sadece <strong>{selectedFieldLabel}</strong> alanında arama yapılıyor
        </p>
      )}
    </div>
  )
}
