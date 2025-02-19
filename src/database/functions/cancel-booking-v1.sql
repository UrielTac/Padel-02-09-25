-- Primero eliminamos todas las versiones existentes de la función
DROP FUNCTION IF EXISTS public.cancel_booking_v1(uuid, text, boolean, numeric, text, text);
DROP FUNCTION IF EXISTS public.cancel_booking_v1(uuid, text, boolean);

-- Luego creamos la nueva versión
CREATE OR REPLACE FUNCTION public.cancel_booking_v1(
  p_booking_id UUID,
  p_reason TEXT,
  p_should_charge BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_result JSONB;
BEGIN
  -- 1. Obtener y validar la reserva
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada'
      USING HINT = 'Verifica el ID de la reserva',
            ERRCODE = 'BOOKING_NOT_FOUND';
  END IF;

  IF v_booking.cancelled_at IS NOT NULL THEN
    RAISE EXCEPTION 'La reserva ya está cancelada'
      USING HINT = 'La reserva fue cancelada el ' || v_booking.cancelled_at,
            ERRCODE = 'BOOKING_ALREADY_CANCELLED';
  END IF;

  -- 2. Actualizar la reserva
  UPDATE bookings
  SET 
    cancelled_at = NOW(),
    cancellation_reason = p_reason,
    payment_status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- 3. Preparar respuesta
  SELECT jsonb_build_object(
    'booking_id', v_booking.id,
    'cancelled_at', NOW(),
    'reason', p_reason,
    'should_charge', p_should_charge
  ) INTO v_result;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Log del error
  INSERT INTO error_logs (
    error_code,
    error_message,
    context_data,
    created_at
  ) VALUES (
    SQLSTATE,
    SQLERRM,
    jsonb_build_object(
      'function', 'cancel_booking_v1',
      'booking_id', p_booking_id,
      'reason', p_reason,
      'should_charge', p_should_charge
    ),
    NOW()
  );

  RAISE;
END;
$$;

-- Establecer los permisos necesarios (corregidos para la nueva versión)
GRANT EXECUTE ON FUNCTION public.cancel_booking_v1(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking_v1(UUID, TEXT, BOOLEAN) TO service_role; 