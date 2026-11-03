
SELECT * FROM registry.sb_iterator(
    ARRAY[1], -- ROW_ID
    'ALLOCATE_TO_MERCHANT',
    ARRAY[]::INTEGER[], -- VID ARRAY
    ARRAY[1], -- DID ARRAY
    ARRAY[]::INTEGER[], -- Empty array
    ARRAY[]::INTEGER[], -- Empty array
    ARRAY[1]::INTEGER[], -- Empty array
    ARRAY['abc_1'], -- EBY ARRAY
    ARRAY[1]::INTEGER[] -- Empty array
);
