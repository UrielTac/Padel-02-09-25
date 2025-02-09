"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'
import { useCurrentEmpresa } from '@/hooks/useCurrentEmpresa'

interface UseCompanyLinkProps {
  branchId?: string
  classId?: string
}

export function useCompanyLink({ branchId, classId }: UseCompanyLinkProps) {
  const [companyLink, setCompanyLink] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasExistingLink, setHasExistingLink] = useState(false)
  const { empresa } = useCurrentEmpresa()

  const supabase = createClientComponentClient<Database>()

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      // Reemplazar espacios y caracteres especiales por guiones
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      // Eliminar acentos
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  }

  const getUniqueSlug = async (baseSlug: string): Promise<string> => {
    let slug = baseSlug
    let counter = 1
    let isUnique = false

    while (!isUnique) {
      const { data } = await supabase
        .from('company_links')
        .select('slug')
        .eq('slug', slug)
        .single()

      if (!data) {
        isUnique = true
      } else {
        slug = `${baseSlug}-${counter}`
        counter++
      }
    }

    return slug
  }

  const generateCompanyLink = async (empresaId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Verificar si ya existe un link
      const { data: existingLink } = await supabase
        .from('company_links')
        .select('slug')
        .eq('empresa_id', empresaId)
        .eq('type', 'classes')
        .single()

      if (existingLink) {
        setHasExistingLink(true)
        return existingLink.slug
      }

      // Obtener el nombre de la empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('name')
        .eq('id', empresaId)
        .single()

      if (empresaError) throw empresaError
      if (!empresaData?.name) throw new Error('No se encontró el nombre de la empresa')

      // Generar slug base y obtener uno único
      const baseSlug = generateSlug(empresaData.name)
      const uniqueSlug = await getUniqueSlug(baseSlug)

      // Crear el nuevo link
      const { data: newLink, error: createError } = await supabase
        .from('company_links')
        .insert({
          empresa_id: empresaId,
          slug: uniqueSlug,
          type: 'classes',
          is_active: true,
          settings: {
            theme: {
              primary_color: '#000000',
              logo_url: null
            },
            features: {
              allow_guest: true,
              require_auth: false,
              show_prices: true
            },
            restrictions: {
              max_bookings_per_user: null,
              advance_days: null
            }
          }
        })
        .select('slug')
        .single()

      if (createError) throw createError

      toast.success('Link generado exitosamente')
      return newLink.slug
    } catch (err) {
      console.error('Error al generar el link:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchCompanyLink = async () => {
      if (!branchId || !empresa?.id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Verificar si existe un link
        const { data: existingLink } = await supabase
          .from('company_links')
          .select('slug')
          .eq('empresa_id', empresa.id)
          .eq('type', 'classes')
          .single()

        if (existingLink) {
          setHasExistingLink(true)
          setCompanyLink(`${window.location.origin}/clases/${existingLink.slug}`)
        } else {
          setHasExistingLink(false)
          setCompanyLink(null)
        }
      } catch (err) {
        console.error('Error al obtener el link de la empresa:', err)
        setError(err as Error)
        toast.error('Error al obtener el link de la empresa')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanyLink()
  }, [branchId, supabase, empresa?.id])

  const handleGenerateLink = async () => {
    if (!empresa?.id) {
      toast.error('No se pudo identificar la empresa')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const slug = await generateCompanyLink(empresa.id)
      setCompanyLink(`${window.location.origin}/clases/${slug}`)
      setHasExistingLink(true)
    } catch (err) {
      console.error('Error al generar el link:', err)
      setError(err as Error)
      toast.error('Error al generar el link')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!companyLink) return

    try {
      await navigator.clipboard.writeText(companyLink)
      toast.success('Link copiado al portapapeles')
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err)
      toast.error('Error al copiar el link')
    }
  }

  return {
    companyLink,
    isLoading,
    error,
    copyToClipboard,
    generateLink: handleGenerateLink,
    hasExistingLink
  }
} 