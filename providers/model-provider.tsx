"use client"
import {useEffect , useState} from "react"
import { StoreModel } from "@/components/models/store-model";


export const ModelProvider = ()=>{
      const [isMounted,setIsMounted] = useState(false);
      useEffect(()=>{

            setIsMounted(true);

      },[]);

      if(!isMounted){
            return null;
      }
      return (
            <>
            <StoreModel/>
            </>
      )
}